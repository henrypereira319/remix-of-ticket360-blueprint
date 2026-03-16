interface SectionSeparatorProps {
  title?: string;
}

const SectionSeparator = ({ title }: SectionSeparatorProps) => {
  return (
    <div className="w-full border-b border-separator mb-1 text-center">
      {title && (
        <span className="font-display text-lg font-semibold text-foreground">
          {title}
        </span>
      )}
    </div>
  );
};

export default SectionSeparator;
