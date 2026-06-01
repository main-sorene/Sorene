"use client";

export const Box = () => {
  // Row data: active state determines if background is shown
  const rows = [
    {
      iconSrc: "/figmaAssets/house.svg",
      active: true,
    },
    {
      iconSrc: "/figmaAssets/house-2.svg",
      active: false,
    },
  ];

  return (
    <div className="w-[362px] h-[146px]">
      {/* Container with dashed purple border */}
      <div className="w-[362px] h-[146px] rounded-[5px] overflow-hidden border border-dashed border-[#8a38f5] flex flex-col justify-center gap-[17px] py-[21px] px-5">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-0">
            {/* Icon-only button on the left */}
            <div
              className={`w-11 h-11 flex items-center justify-center px-3 py-2 rounded-lg flex-shrink-0 ${
                row.active ? "bg-[#ecedee]" : ""
              }`}
            >
              <img className="w-5 h-5" alt="House" src={row.iconSrc} />
            </div>

            {/* Input-like element with icon and placeholder text */}
            <div
              className={`w-[238px] h-11 flex items-center gap-2 px-3 py-2 rounded-lg ml-[16px] ${
                row.active ? "bg-[#ecedee]" : ""
              }`}
            >
              <img
                className="w-5 h-5 flex-shrink-0"
                alt="House"
                src={row.iconSrc}
              />
              <span className="flex-1 font-body-small-medium font-[number:var(--body-small-medium-font-weight)] text-[#151515] text-[length:var(--body-small-medium-font-size)] tracking-[var(--body-small-medium-letter-spacing)] leading-[var(--body-small-medium-line-height)] [font-style:var(--body-small-medium-font-style)]">
                Placeholder
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
