import React from "react";
import type { Metadata } from "next";
import "@/styles/pages/home.css";
import {
  getArticles,
  getCategories,
  getHomepageMedia,
  getProducts,
  getProjects,
  getSiteSettings,
} from "@/lib/data-service";
import { buildOrganizationJsonLd, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { HeroSlider } from "@/components/home/HeroSlider";
import { VideoReelsCarousel } from "@/components/home/VideoReelsCarousel";
import { FeaturedSplit } from "@/components/home/FeaturedSplit";
import { AboutSection } from "@/components/home/AboutSection";
import { ServicesSwitcher } from "@/components/home/ServicesSwitcher";
import { SpotlightSection } from "@/components/home/SpotlightSection";
import { CommitmentSection } from "@/components/home/CommitmentSection";
import { DreamSpacesSection } from "@/components/home/DreamSpacesSection";
import { CatalogueBanner } from "@/components/home/CatalogueBanner";
import { RoomApplicationsSection } from "@/components/home/RoomApplicationsSection";
import { CategoryExplorerSection } from "@/components/home/CategoryExplorerSection";
import { HomeProjectsMarquee } from "@/components/home/HomeProjectsMarquee";
import { HomeLibrarySection } from "@/components/home/HomeLibrarySection";
import { HomeNewsSection } from "@/components/home/HomeNewsSection";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    ...buildPageMetadata({
      title: `${settings.name} | ${settings.tagline}`,
      description: settings.description,
      path: "/",
      image: "/images/hero-leather.jpg",
      siteName: settings.name,
    }),
    title: {
      absolute: `${settings.name} | ${settings.tagline}`,
    },
  };
}

export default async function HomePage() {
  const [
    settings,
    categories,
    products,
    projects,
    libraryArticles,
    newsArticles,
    homepageMedia,
  ] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getProducts(),
    getProjects(),
    getArticles("library"),
    getArticles("news"),
    getHomepageMedia(),
  ]);

  const { spotlightNordic, spotlightWood } = homepageMedia;

  return (
    <>
      <JsonLd data={buildOrganizationJsonLd(settings)} />
      <HeroSlider slides={homepageMedia.heroSlides} />
      <VideoReelsCarousel reels={homepageMedia.videoReels} />
      <FeaturedSplit />
      <AboutSection />
      <ServicesSwitcher />
      <SpotlightSection
        variant="side"
        surfaceClass="is-slate"
        eyebrow={spotlightNordic.eyebrow}
        label={spotlightNordic.label}
        title={spotlightNordic.title}
        description={spotlightNordic.description}
        ctaLabel={spotlightNordic.ctaLabel}
        href={spotlightNordic.href}
        image={spotlightNordic.image}
        posterImage={spotlightNordic.posterImage}
        videoUrl={spotlightNordic.videoUrl}
      />
      <SpotlightSection
        variant="overlay"
        surfaceClass="is-ink"
        eyebrow={spotlightWood.eyebrow}
        label={spotlightWood.label}
        title={spotlightWood.title}
        description={spotlightWood.description}
        ctaLabel={spotlightWood.ctaLabel}
        href={spotlightWood.href}
        image={spotlightWood.image}
        posterImage={spotlightWood.posterImage}
        videoUrl={spotlightWood.videoUrl}
      />
      <CommitmentSection
        stageImage={homepageMedia.commitmentStageImage}
        stageVideoUrl={homepageMedia.commitmentStageVideoUrl}
        stageCaption={homepageMedia.commitmentStageCaption}
      />
      <DreamSpacesSection products={products} />
      <CatalogueBanner />
      <RoomApplicationsSection products={products} />
      <CategoryExplorerSection categories={categories} />
      <HomeProjectsMarquee projects={projects} />
      <HomeLibrarySection articles={libraryArticles} />
      <HomeNewsSection articles={newsArticles} />
    </>
  );
}
