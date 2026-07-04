import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white p-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-brand-100 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-brand-700">PMS Packaging</h1>
        <p className="mt-3 text-lg text-gray-600">A modern packaging commerce starter with a React frontend and an Express/Prisma backend.</p>
        <div className="mt-8 flex gap-4">
          <Link className="rounded bg-brand-600 px-4 py-2 text-white" to="/products">Browse products</Link>
          <a className="rounded border border-brand-600 px-4 py-2 text-brand-700" href="http://localhost:5000/health" target="_blank" rel="noreferrer">Check API</a>
        </div>
      </div>
    </div>
  );
}

function Products() {
  return <div className="p-8 text-xl">Products page placeholder</div>;
}

export default function App() {
  return (
    <Router>
      <nav className="flex gap-4 border-b bg-white px-8 py-4">
        <Link to="/" className="font-semibold text-brand-700">Home</Link>
        <Link to="/products" className="font-semibold text-brand-700">Products</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </Router>
  );
}
