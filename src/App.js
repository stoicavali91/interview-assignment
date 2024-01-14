import React, { useState } from 'react';
import Papa from 'papaparse';

const App = () => {

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  //Import the data.csv file with Papaparse
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    Papa.parse(file, {
      header: true,
      complete: (result) => {
        setData(result.data);
      },
    });
  };

  //Filter the data
  const handleFilterChange = (e) => {
    const value = e.target.value;
    const [year, month] = value.split('-');
    setSelectedMonth(month);
    setSelectedYear(year);

    // Filter the data based on the selected month and year
    const filtered = data.filter((reservation) => {
      const startDay = new Date(reservation[' Start Day']);
      const endDay = reservation[' End Day'] ? new Date(reservation[' End Day']) : null;

      //Verify if the reservation Start Day falls within the selected month and year
      const isStartInSelectedMonth =
        startDay.getFullYear() === parseInt(year, 10) && startDay.getMonth() === parseInt(month, 10) - 1;

      //Verify if the reservation is active within the selected month, based on its End Day particularities
      const isActiveInSelectedMonth =
        !endDay ||
        (endDay &&
          (endDay.getFullYear() > parseInt(year, 10) ||
            (endDay.getFullYear() === parseInt(year, 10) && endDay.getMonth() >= parseInt(month, 10))));

      //Verify if a reservation that started before the selected month is still active
      const isStartedBeforeSelectedMonth =
        startDay.getFullYear() < parseInt(year, 10) ||
        (startDay.getFullYear() === parseInt(year, 10) && startDay.getMonth() < parseInt(month, 10) - 1);

      return (isStartInSelectedMonth || isStartedBeforeSelectedMonth) && isActiveInSelectedMonth;
    });

    setFilteredData(filtered);
  };

  //Calculating the revenue of the incomplete months reservations
  const calculateRevenueForIncompleteMonths = (reservation, selectedYear, selectedMonth) => {
    const startDay = new Date(reservation[' Start Day']);
    const endDay = reservation[' End Day'] ? new Date(reservation[' End Day']) : null;

    //calculate how many days an incomplete month reservation has
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysInReservationMonth = endDay ? endDay.getDate() : daysInMonth;

    const activeDaysInMonth = Math.min(daysInMonth, daysInReservationMonth) - startDay.getDate() + 1;
    const monthlyPrice = parseInt(reservation[' Monthly Price'], 10) || 0;

    //calculate the revenue for the reservation
    return (monthlyPrice / daysInReservationMonth) * activeDaysInMonth;
  };

  //calculate the monthly revenue
  const monthlyRevenue = () => {
    // Calculate revenue for incomplete months and sum up the 'Monthly Price' column
    const totalRevenue = filteredData.reduce((total, reservation) => {
      const startDay = new Date(reservation[' Start Day']);
      const endDay = reservation[' End Day'] ? new Date(reservation[' End Day']) : null;

      const year = startDay.getFullYear();
      const month = startDay.getMonth();

      if (!endDay || (endDay.getFullYear() === year && endDay.getMonth() === month)) {
        // Complete month
        const monthlyPrice = parseInt(reservation[' Monthly Price'], 10) || 0;
        return total + monthlyPrice;
      } else {
        // Incomplete month
        const revenueForIncompleteMonth = calculateRevenueForIncompleteMonths(reservation, year, month);
        return total + revenueForIncompleteMonth;
      }
    }, 0);

    return totalRevenue;
  };

  //Based on the assignment indications, we know that the total capacity of the offices is 266, so the total unreserved capacity is 266 minus the total reserved capacity
  const calculateTotalUnreservedCapacity = () => {
    // Calculate the sum of the 'Capacity' column in the filtered data
    const totalReservedCapacity = filteredData.reduce((total, reservation) => {
      const capacity = parseInt(reservation['Capacity'], 10) || 0;
      return total + capacity;
    }, 0);

    // Calculate the total unreserved capacity
    const totalCapacity = 266;
    const totalUnreservedCapacity = totalCapacity - totalReservedCapacity;

    return totalUnreservedCapacity;
  };

  return (
    <div className="relative z-10 flex justify-center items-center flex-col max-w-7xl mx-auto pt-8 mt-20 font-poppins">
      <div className=' text-center justify-center items-center space-y-4'>
        <div className='flex flex-center flex-row '>
          <input type="file" onChange={handleFileChange} accept=".csv" className='w-30 justify-center '/>
          <label>
            Select Month and Year:{' '}
            <input type="month" id="monthYear" onChange={handleFilterChange} value={`${selectedYear}-${selectedMonth}`} className='border-2 border-black p-2'/>
          </label>
        </div>
        
        <br />
        <div>
          <h2 className='text-3xl'>Results:</h2>
          <p>Total Monthly Revenue: ${monthlyRevenue().toFixed(2)}</p>
          <p>Total Unreserved Capacity: {calculateTotalUnreservedCapacity()}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
