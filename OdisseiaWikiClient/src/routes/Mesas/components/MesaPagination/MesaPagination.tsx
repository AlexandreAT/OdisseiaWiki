import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Pagination } from '../../Mesas.style';

interface MesaPaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const MesaPagination = ({ page, totalPages, onChange }: MesaPaginationProps) => {
  if (totalPages <= 1) return null;
  return (
    <Pagination aria-label="Paginação de Mesas">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
        <ChevronLeftIcon />
      </button>
      <span>{page}</span>
      <span aria-hidden="true">/</span>
      <span>{totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Próxima página">
        <ChevronRightIcon />
      </button>
    </Pagination>
  );
};
