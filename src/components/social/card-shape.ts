export const getAlternatingCardShapeClass = (index: number) =>
  index % 2 === 0
    ? "rounded-tl-[8px] rounded-tr-[30px] rounded-br-[8px] rounded-bl-[30px]"
    : "rounded-tl-[30px] rounded-tr-[8px] rounded-br-[30px] rounded-bl-[8px]";
