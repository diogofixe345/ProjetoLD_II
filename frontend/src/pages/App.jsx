import Navbar from './Navbar';
import iTasks from './Tasks';
import { useNavigate } from 'react-router-dom';
import { TextInput, Card, Metric, Text, Button } from '@tremor/react';
import { RiSearchLine } from '@remixicon/react';
import Tasks from './Tasks';



function App() {

  const navigate = useNavigate();


  return (
    <>
      <div>
        <Navbar />
        <div className="pl-6 max-w-sm space-y-8">
          <div className='pt-24' > </div>
          
        </div>

      <Tasks/>


      </div>

    </>
  );
}
export default App;
