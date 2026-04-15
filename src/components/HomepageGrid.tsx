import Header from "@/components/Header";
import Footer from "@/components/Footer";

export interface HomepageItem {
  id: number;
  type: "product" | "category";
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  position: number;
  active: boolean;
}

export default function HomepageGrid({ items }: { items: HomepageItem[] }) {
  return (
    <div className="page-wrapper">
      <Header />
      <div className="hp-grid">
        {items.map((item) => (
          <a key={item.id} href={item.link_url || "#"} className={`hp-grid-card hp-grid-card--${item.type}`}>
            {item.image_url && (
              <div className="hp-grid-card__img-wrap">
                <img src={item.image_url} alt={item.title} className="hp-grid-card__img" />
              </div>
            )}
            <div className="hp-grid-card__body">
              {item.type === "category" && <span className="hp-grid-card__badge">Categorie</span>}
              <h3 className="hp-grid-card__title">{item.title}</h3>
              {item.description && <p className="hp-grid-card__desc">{item.description}</p>}
            </div>
          </a>
        ))}
      </div>
      <Footer />
    </div>
  );
}
