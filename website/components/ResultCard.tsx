interface ResultCardProps {
  quote: string;
  attribution: string;
}

export default function ResultCard({ quote, attribution }: ResultCardProps) {
  return (
    <div 
      className="group border border-white/10 rounded-2xl p-6 bg-card hover:border-accent/40 hover:bg-[#111827] transition-all duration-300 flex flex-col relative"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent/40 rounded-t-2xl" />
      <div className="text-4xl text-accent mb-4">“</div>
      <p className="text-muted flex-grow leading-relaxed">
        {quote}
      </p>
      <div className="mt-4 pt-4 border-t border-white/10 text-sm text-subtle">
        {attribution}
      </div>
    </div>
  );
}
