import { useParams } from 'react-router-dom';
import OrderTracking from '../OrderTracking.jsx';

export default function QrOrderTrack() {
  const { token } = useParams();
  return <OrderTracking token={token} />;
}
