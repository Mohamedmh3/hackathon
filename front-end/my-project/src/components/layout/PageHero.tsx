interface PageHeroProps {
  eyebrow?: string
  title: string
  description?: string
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="page-hero" aria-labelledby="page-hero-title">
      <div className="page-hero-inner">
        {eyebrow ? <p className="page-hero-eyebrow">{eyebrow}</p> : null}
        <h2 id="page-hero-title" className="page-hero-title">
          {title}
        </h2>
        {description ? (
          <p className="page-hero-description">{description}</p>
        ) : null}
      </div>
    </section>
  )
}
