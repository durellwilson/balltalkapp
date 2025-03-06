import React from 'react';

interface AthleteProfileCardUserViewProps {
  imageUrl: string;
  name: string;
  sport: string;
}

const AthleteProfileCardUserView: React.FC<AthleteProfileCardUserViewProps> = ({ imageUrl, name, sport }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
      <img src={imageUrl} alt={name} style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
      <div style={{ marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>{name}</div>
      <div style={{ marginTop: '5px', textAlign: 'center', fontSize: '0.9em' }}>{sport}</div>
    </div>
  );
};

export default AthleteProfileCardUserView;