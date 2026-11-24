"use client";

import React from "react";
import { featuredTiles } from "@/data/homepage";
import { MorePill } from "./MorePill";

export function FeaturedSplit() {
  return (
    <section
      id="collections"
      className="v2-section is-slate v2-featured"
      aria-label="Bộ sưu tập nổi bật"
    >
      {featuredTiles.map((tile) => (
        <article key={tile.id} className="v2-featured-tile v2-more-trigger">
          <div className="v2-parallax is-media v2-featured-media">
            <div className="v2-parallax-inner">
              <img src={tile.image} alt={tile.title} />
              <img
                src={tile.hoverImage}
                alt=""
                aria-hidden="true"
                className="v2-featured-hover"
              />
              <div className="v2-media-vignette" />
            </div>
          </div>

          <div className="v2-featured-scrim" aria-hidden="true" />

          <div className="v2-featured-copy">
            <div className="v2-featured-text" data-reveal="">
              <span className="v2-featured-eyebrow">{tile.eyebrow}</span>
              <h2>{tile.title}</h2>
              <p className="v2-featured-desc">{tile.description}</p>
            </div>

            <div className="v2-featured-action" data-reveal="">
              <MorePill href={tile.href} label={tile.ctaLabel} />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
