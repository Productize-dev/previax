"use client";

import { useData } from "@/context/data-context";
import { cn } from "@/lib/utils";

import { useNetflixRowSelection } from "./use-netflix-row-selection";

function lenderInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function NetflixLendersRow() {
  const { lenders } = useData();
  const items = [...lenders].sort((a, b) => a.order - b.order);

  const { selectedIndex, selectIndex, selectOnHover, trackRef, itemRefs } =
    useNetflixRowSelection({
      items,
      defaultIndex: 0,
    });

  if (items.length === 0) return null;

  return (
    <section className="netflix-row-section group/row" id="lenders">
      <h2 className="netflix-row-title">Preferred Lenders</h2>
      <div
        ref={trackRef}
        className="netflix-focus-track netflix-lenders-track"
        tabIndex={0}
        role="listbox"
        aria-label="Preferred Lenders"
        aria-activedescendant={`lenders-item-${selectedIndex}`}
      >
        {items.map((lender, index) => {
          const selected = index === selectedIndex;

          return (
            <div
              key={lender.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              id={`lenders-item-${index}`}
              role="option"
              aria-selected={selected}
              className={cn(
                "netflix-lender-tile",
                selected && "netflix-lender-tile--selected",
              )}
              onMouseEnter={() => selectOnHover(index)}
            >
              <button
                type="button"
                onClick={() => selectIndex(index, { immediate: true })}
                onFocus={() => selectIndex(index, { immediate: true })}
                className="netflix-lender-button outline-none"
                aria-label={lender.name}
              >
                <div
                  className={cn(
                    "netflix-lender-circle",
                    selected && "netflix-lender-circle--selected",
                  )}
                >
                  {lender.imageUrl ? (
                    <img
                      src={lender.imageUrl}
                      alt=""
                      className="size-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <span className="netflix-lender-initials">
                      {lenderInitials(lender.name)}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "netflix-lender-name",
                    selected && "netflix-lender-name--selected",
                  )}
                >
                  {lender.name}
                </p>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
