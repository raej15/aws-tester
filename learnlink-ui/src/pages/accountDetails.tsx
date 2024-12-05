import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './accountDetails.css';
import CopyrightFooter from '../components/CopyrightFooter';

const AccountDetails: React.FC = () => {

  // State to store user profile data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the current user profile data
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        if (token) {
          const userResponse = await fetch(`${process.env.API_URL}/api/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const userData = await userResponse.json();
          console.log('User data:', userData);

          setFormData({
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            username: userData.username || ''
          });

          
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Navbar />

      <div className='detailHeader'>Account</div>
      <div className="user-details">
        <p><strong>First Name:</strong> {formData.first_name}</p>
        <p><strong>Last Name:</strong> {formData.last_name}</p>
        <p><strong>Username:</strong> {formData.username}</p>
        <p><strong>Email:</strong> {formData.email || 'No email available'}</p>
      </div>

      <CopyrightFooter />
    </div>
  );
};

export default AccountDetails;
