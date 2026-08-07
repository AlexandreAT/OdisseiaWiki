import { useEffect, useState } from 'react';
import {
  getApiAvailabilityStatus,
  subscribeToApiAvailability,
} from '../../services/apiAvailability';

export const useApiAvailabilityStatus = () => {
  const [status, setStatus] = useState(getApiAvailabilityStatus);

  useEffect(() => subscribeToApiAvailability(setStatus), []);

  return status;
};
