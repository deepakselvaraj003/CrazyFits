import { useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";

function CategoryDropdown({
  categories,
  selectedCategory,
  onSelectCategory,
}) {
  const [open, setOpen] = useState(false);

  const selectedItem =
    categories.find((item) => item.id === selectedCategory)?.name || "All";

  return (
    <div className="relative mb-6 w-full sm:max-w-[220px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-surface px-4 text-sm font-medium shadow-sm transition-all duration-200 hover:border-primary"
      >
        <span className="max-w-[150px] truncate">
          {selectedItem}
        </span>

        <MdKeyboardArrowDown
          className={`shrink-0 text-xl transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute left-0 top-full z-50 mt-2
            max-h-72 w-full overflow-y-auto
            rounded-xl border border-border
            bg-background p-2 shadow-lg

            [scrollbar-width:thin]
            [scrollbar-color:#d1d5db_transparent]

            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-400
          "
        >
          <button
            type="button"
            onClick={() => {
              onSelectCategory(null);
              setOpen(false);
            }}
            className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
              selectedCategory === null
                ? "bg-primary text-surface"
                : "text-dark hover:bg-surface"
            }`}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                onSelectCategory(category.id);
                setOpen(false);
              }}
              className={`mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                selectedCategory === category.id
                  ? "bg-primary text-surface"
                  : "text-dark hover:bg-surface"
              }`}
            >
              <span className="block truncate">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryDropdown;