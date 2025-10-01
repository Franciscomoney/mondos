'use client';

export default function TestButtons() {
  const mockDocuments = [
    {
      id: 5,
      original_filename: "administracion senor otalora.pdf",
      status: "completed",
      processed_html_path: "projects/presidente-jose-otalora/processed/html/administracion senor otalora_1756630314400.html",
      processed_markdown_path: "projects/presidente-jose-otalora/processed/markdown/administracion senor otalora_1756630314400.md"
    }
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Static Test - Should Show Buttons</h1>
      
      <div className="mb-8 p-4 bg-green-100 rounded">
        <p>Mock document data:</p>
        <pre>{JSON.stringify(mockDocuments[0], null, 2)}</pre>
      </div>

      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border p-2">Filename</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockDocuments.map((doc) => (
            <tr key={doc.id}>
              <td className="border p-2">{doc.original_filename}</td>
              <td className="border p-2">{doc.status}</td>
              <td className="border p-2">
                {doc.status === 'completed' && doc.processed_html_path ? (
                  <>
                    <a
                      href={`/uploads/${doc.processed_html_path}`}
                      className="text-indigo-600 underline font-bold"
                    >
                      View HTML
                    </a>
                    <span className="mx-2">|</span>
                    <a
                      href={`/uploads/${doc.processed_markdown_path}`}
                      className="text-indigo-600 underline font-bold"
                    >
                      Download MD
                    </a>
                  </>
                ) : (
                  <span>No buttons should appear here</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}