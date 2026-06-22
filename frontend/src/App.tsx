import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PetList } from './pages/pets/PetList';
import { PetForm } from './pages/pets/PetForm';
import { PetDetail } from './pages/pets/PetDetail';
import { OwnerList } from './pages/owners/OwnerList';
import { OwnerForm } from './pages/owners/OwnerForm';
import { OwnerDetail } from './pages/owners/OwnerDetail';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/pets" replace />} />

        <Route path="pets" element={<PetList />} />
        <Route path="pets/new" element={<PetForm />} />
        <Route path="pets/:id" element={<PetDetail />} />
        <Route path="pets/:id/edit" element={<PetForm />} />

        <Route path="owners" element={<OwnerList />} />
        <Route path="owners/new" element={<OwnerForm />} />
        <Route path="owners/:id" element={<OwnerDetail />} />
        <Route path="owners/:id/edit" element={<OwnerForm />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
