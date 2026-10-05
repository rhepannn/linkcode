// Data terstruktur (schema.org) untuk mesin pencari. `<` di-escape agar string dalam JSON tidak
// bisa menutup tag <script> (pencegahan XSS).
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
