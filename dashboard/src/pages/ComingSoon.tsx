interface Props {
  title: string;
  note: string;
}

export default function ComingSoon({ title, note }: Props) {
  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <p>{note}</p>
        </div>
      </div>
    </div>
  );
}
