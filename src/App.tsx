import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SchedulePage from './pages/SchedulePage';
import CouplePage from './pages/CouplePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SchedulePage />} />
          <Route path="couple" element={<CouplePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

