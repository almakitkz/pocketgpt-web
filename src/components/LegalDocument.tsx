import Link from "next/link";

export type LegalSection = {
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
};

type Highlight = {
  label: string;
  value: string;
};

type LegalDocumentProps = {
  title: string;
  updatedLabel: string;
  effectiveDate: string;
  versionLabel: string;
  version: string;
  intro: string;
  highlights: readonly Highlight[];
  sections: readonly LegalSection[];
  notice: string;
  relatedLabel: string;
  relatedHref: string;
  relatedText: string;
  serviceLabel: string;
  serviceName: string;
  contactLabel: string;
  contactEmail: string;
};

export function LegalDocument({
  title,
  updatedLabel,
  effectiveDate,
  versionLabel,
  version,
  intro,
  highlights,
  sections,
  notice,
  relatedLabel,
  relatedHref,
  relatedText,
  serviceLabel,
  serviceName,
  contactLabel,
  contactEmail,
}: LegalDocumentProps) {
  return (
    <main className="pg-legal-page">
      <div className="pg-legal-document">
        <header className="pg-legal-header">
          <div className="pg-legal-kicker">PocketGPT Legal</div>
          <h1>{title}</h1>
          <div className="pg-legal-meta">
            <span>{updatedLabel}: {effectiveDate}</span>
            <span>{versionLabel}: {version}</span>
          </div>
          <p>{intro}</p>
        </header>

        <div className="pg-legal-highlights" aria-label="Subscription summary">
          {highlights.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="pg-legal-sections">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets?.length ? (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <aside className="pg-legal-notice">{notice}</aside>

        <footer className="pg-legal-footer">
          <div>
            <span>{serviceLabel}</span>
            <strong>{serviceName}</strong>
          </div>
          <div>
            <span>{contactLabel}</span>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </div>
          <Link href={relatedHref}>{relatedLabel}: {relatedText}</Link>
        </footer>
      </div>
    </main>
  );
}
