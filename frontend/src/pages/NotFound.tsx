import { Link } from 'react-router-dom';
import { EmptyState } from '../components/data/StateBlock';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you’re looking for doesn’t exist."
      action={
        <Link to="/pets">
          <Button>Go to pets</Button>
        </Link>
      }
    />
  );
}
