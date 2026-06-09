import { useMemo } from "react";
import { FaLeaf, FaUsers } from "react-icons/fa";
import {
  getMenuEmptyState,
  getMenuSectionItems,
  normalizeRestaurantMenuPreview,
} from "./restaurantMenuState";

const RestaurantMenuPreview = ({ preview }) => {
  const menu = useMemo(() => normalizeRestaurantMenuPreview(preview || {}), [preview]);
  const sectionedItems = useMemo(
    () => getMenuSectionItems(menu.sections, menu.items),
    [menu]
  );

  const visibleItems = menu.featuredItems.length ? menu.featuredItems : menu.items.slice(0, 6);
  const hasGroupItems = menu.groupFriendlyItems.length > 0;
  const hasPreorderItems = menu.preorderItems.length > 0;

  if (!visibleItems.length && !sectionedItems.some((s) => s.items.length > 0)) {
    return (
      <section className="rounded-[28px] border border-[#d8c8ae] bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
          Menu preview
        </p>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
          {getMenuEmptyState()}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_24px_80px_rgba(35,66,50,0.10)]">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
        Menu preview
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
        Menu highlights
      </h2>

      {sectionedItems.length > 0 && sectionedItems.some((s) => s.items.length > 0) ? (
        <div className="mt-5 space-y-6">
          {sectionedItems
            .filter((section) => section.items.length > 0)
            .map((section) => (
              <div key={section.id || section._id}>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#234232]">
                  {section.title}
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {section.items.slice(0, 4).map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[20px] border border-[#eadcc5] bg-[#fffaf1] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                          {item.name}
                        </h3>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7451]">
                          {item.priceLabel}
                        </span>
                      </div>
                      {item.description ? (
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                          {item.description}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.groupFriendly ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6f0] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#234232]">
                            <FaUsers /> Group
                          </span>
                        ) : null}
                        {item.dietaryTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600"
                          >
                            <FaLeaf /> {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-[26px] border border-[#eadcc5] bg-[#fffaf1] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                    {item.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7451]">
                    {item.priceLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {item.description || "Details confirmed by the operator."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.groupFriendly ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6f0] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#234232]">
                      <FaUsers /> Group
                    </span>
                  ) : null}
                  {item.dietaryTags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600"
                    >
                      <FaLeaf /> {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {hasGroupItems || hasPreorderItems ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {hasGroupItems ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef6f0] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#234232]">
              <FaUsers /> Group-friendly options available
            </span>
          ) : null}
          {hasPreorderItems ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fffaf1] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7451]">
              Pre-order enabled
            </span>
          ) : null}
        </div>
      ) : null}

      <p className="mt-5 text-xs font-bold leading-5 text-slate-500">
        {menu.disclaimer}
      </p>
    </section>
  );
};

export default RestaurantMenuPreview;
