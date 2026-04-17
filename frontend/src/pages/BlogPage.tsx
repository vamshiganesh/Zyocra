import { ClippedCard } from "../components/ui/ClippedCard";
import { GeoFrame } from "../components/ui/GeoFrame";
import { SectionHeader } from "../components/ui/SectionHeader";
import { blogPosts } from "../data/placeholders";
import "./pages.css";

export function BlogPage() {
  return (
    <div className="page page--wide stack--loose">
      <section className="hero">
        <div>
          <p className="hero__eyebrow mono-label label-dot">Blog</p>
          <h1 className="hero__title">
            Articles, notes, and case studies on verifiable risk.
          </h1>
          <p className="hero__body">
            Insights on zkML circuits, LoRA structure, quantization, and DeFi
            risk-parameter design. Placeholder posts for layout only.
          </p>
        </div>
      </section>

      <ClippedCard clip="tl">
        <div id="insights">
          <SectionHeader
            label="Insights"
            title="Latest notes from the research log"
            description="Static cards—content is illustrative, not published research."
          />
          <div className="blog-grid">
            {blogPosts.map((post) => (
              <article key={post.title} className="blog-card">
                <GeoFrame variant={post.variant} caption="Illustration" />
                <div className="blog-card__body">
                  <h3 className="blog-card__title">{post.title}</h3>
                  <div className="blog-card__meta">
                    <span>{post.category}</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </ClippedCard>
    </div>
  );
}
