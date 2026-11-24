import sys

sys.dont_write_bytecode = True

import argparse
import json
import os
import tempfile
import time
import traceback
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List

E2E_DIR = Path(__file__).resolve().parent
if str(E2E_DIR) not in sys.path:
    sys.path.insert(0, str(E2E_DIR))

from helpers import RunConfig, TEST_REGISTRY, TestSpec  # noqa: E402

# Import all test modules so @test_case decorators register all 268 tests
import tier1_chrome  # noqa: E402,F401
import tier1_pages  # noqa: E402,F401
import tier2_chrome  # noqa: E402,F401
import tier2_pages  # noqa: E402,F401
import tier3_pairwise  # noqa: E402,F401
import tier4_e2e_parity  # noqa: E402,F401


VALID_TIERS = {"1", "2", "3", "4", "all"}


def parse_tier_arg(value: str) -> str:
    tokens = [t.strip().lower() for t in value.split(",")]
    if not tokens or any(t not in VALID_TIERS for t in tokens):
        raise argparse.ArgumentTypeError(
            f"invalid choice: {value!r} (choose comma-separated values from 1, 2, 3, 4, all)"
        )
    if "all" in tokens:
        return "all"
    return ",".join(dict.fromkeys(tokens))


def parse_args(argv: List[str]) -> argparse.Namespace:
    default_screenshots = Path(tempfile.gettempdir()) / "angia_e2e_artifacts" / "screenshots"
    parser = argparse.ArgumentParser(
        description="An Gia Decor 99% Parity Upgrade — Requirement-Driven Playwright E2E Runner"
    )
    parser.add_argument(
        "--tier",
        type=parse_tier_arg,
        default="all",
        help="Test tier(s) to execute: 1, 2, 3, 4, comma-separated (e.g. 1,2), or all (default: all)",
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:3110",
        help="Target Next.js server base URL (default: http://127.0.0.1:3110)",
    )
    parser.add_argument(
        "--live-ref",
        action="store_true",
        help="Enable live reference probe against https://www.nhuydecor.vn/",
    )
    parser.add_argument(
        "--screenshots-dir",
        default=str(default_screenshots),
        help="Directory for parity screenshots",
    )
    parser.add_argument(
        "--json-report",
        default="",
        help="Optional path to write structured JSON test report",
    )
    parser.add_argument(
        "--feature",
        default="",
        help="Comma-separated feature filter (e.g. F04,F18)",
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop immediately on first failure",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Run Chromium with visible browser window",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all registered test IDs, tiers, features, and counts without launching a browser",
    )
    return parser.parse_args(argv)


def filter_tests(specs: List[TestSpec], tier_arg: str, feature_arg: str) -> List[TestSpec]:
    selected = list(specs)
    tier_tokens = [t.strip().lower() for t in tier_arg.split(",") if t.strip()]
    if tier_tokens and "all" not in tier_tokens:
        wanted_tiers = {int(t) for t in tier_tokens}
        selected = [s for s in selected if s.tier in wanted_tiers]
    if feature_arg.strip():
        wanted = {f.strip().upper() for f in feature_arg.split(",") if f.strip()}
        selected = [s for s in selected if any(f.upper() in wanted for f in s.features)]
    return selected


def print_listing(specs: List[TestSpec]) -> None:
    tier_counts = Counter(s.tier for s in specs)
    feat_counts: Dict[str, Counter] = defaultdict(Counter)
    for s in specs:
        for f in s.features:
            feat_counts[f][s.tier] += 1

    print(f"Registered E2E Tests: {len(specs)}")
    for t in sorted(tier_counts):
        print(f"  Tier {t}: {tier_counts[t]} tests")
    print("\nFeature Coverage Breakdown:")
    for feat in sorted(feat_counts):
        c = feat_counts[feat]
        total = sum(c.values())
        print(
            f"  {feat}: total={total:2d} (T1={c[1]:2d}, T2={c[2]:2d}, T3={c[3]:2d}, T4={c[4]:2d})"
        )
    print("\nTest Registry:")
    for s in specs:
        feats = ",".join(s.features)
        print(f"  [T{s.tier}] {s.test_id:<22} ({s.viewport:<9}) [{feats}] - {s.title}")


def check_target_reachable(base_url: str) -> None:
    url = base_url.rstrip("/") + "/"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status >= 500:
                raise RuntimeError(f"Server returned HTTP {resp.status} for {url}")
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Target server unreachable at {url}: {exc}") from exc


def main(argv: List[str]) -> int:
    args = parse_args(argv)
    selected = filter_tests(TEST_REGISTRY, args.tier, args.feature)

    if args.list:
        print_listing(selected)
        return 0

    if not selected:
        print("No tests matched the specified --tier / --feature filter.", file=sys.stderr)
        return 1

    base_url = args.base_url.rstrip("/")
    try:
        check_target_reachable(base_url)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    screenshots_dir = Path(args.screenshots_dir)
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    cfg = RunConfig(
        base_url=base_url,
        screenshots_dir=screenshots_dir,
        live_ref=args.live_ref,
        headed=args.headed,
    )

    from playwright.sync_api import sync_playwright

    results: List[Dict[str, Any]] = []
    tier_stats: Dict[int, Dict[str, int]] = defaultdict(lambda: {"passed": 0, "failed": 0})
    t0_all = time.perf_counter()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not args.headed)
        try:
            for idx, spec in enumerate(selected, start=1):
                t0 = time.perf_counter()
                status = "PASS"
                error_msg = ""
                tb_str = ""
                try:
                    spec.fn(browser, cfg)
                except AssertionError as exc:
                    status = "FAIL"
                    error_msg = str(exc) or exc.__class__.__name__
                    tb_str = traceback.format_exc()
                except Exception as exc:
                    status = "ERROR"
                    error_msg = f"{exc.__class__.__name__}: {exc}"
                    tb_str = traceback.format_exc()
                dur_ms = round((time.perf_counter() - t0) * 1000, 1)

                if status == "PASS":
                    tier_stats[spec.tier]["passed"] += 1
                    print(f"[{idx:3d}/{len(selected)}] PASS  {spec.test_id:<22} ({dur_ms}ms)", flush=True)
                else:
                    tier_stats[spec.tier]["failed"] += 1
                    print(f"[{idx:3d}/{len(selected)}] {status:<5} {spec.test_id:<22} ({dur_ms}ms) -> {error_msg}", flush=True)

                results.append(
                    {
                        "id": spec.test_id,
                        "tier": spec.tier,
                        "features": list(spec.features),
                        "viewport": spec.viewport,
                        "title": spec.title,
                        "status": status,
                        "durationMs": dur_ms,
                        "error": error_msg,
                        "traceback": tb_str if status != "PASS" else "",
                    }
                )
                if status != "PASS" and args.fail_fast:
                    break
        finally:
            browser.close()

    total_ms = round((time.perf_counter() - t0_all) * 1000, 1)
    total_passed = sum(1 for r in results if r["status"] == "PASS")
    total_failed = len(results) - total_passed

    print("\n" + "=" * 72)
    print(f"An Gia Decor E2E Summary (base_url={base_url}, duration={total_ms / 1000:.2f}s)")
    for t in sorted(tier_stats):
        st = tier_stats[t]
        print(f"  Tier {t}: {st['passed']} passed, {st['failed']} failed")
    print(f"  TOTAL : {total_passed}/{len(results)} passed, {total_failed} failed")
    print("=" * 72)

    if args.json_report:
        report_path = Path(args.json_report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        payload: Dict[str, Any] = {
            "baseUrl": base_url,
            "tierFilter": args.tier,
            "featureFilter": args.feature,
            "liveRef": args.live_ref,
            "durationMs": total_ms,
            "summary": {
                "executed": len(results),
                "passed": total_passed,
                "failed": total_failed,
                "byTier": {str(k): v for k, v in sorted(tier_stats.items())},
            },
            "results": results,
        }
        if cfg.extra_artifacts:
            payload["artifacts"] = cfg.extra_artifacts
        report_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    return 0 if total_failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
