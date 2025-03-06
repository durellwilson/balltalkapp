import React from 'react';
import { User } from '../interfaces/User';

interface CollaboratorListProps {
  collaborators: User[];
}

const CollaboratorList: React.FC<CollaboratorListProps> = ({ collaborators }) => {
  return (
    <ul>
      {collaborators.map((collaborator) => (
        <li key={collaborator.id}>{collaborator.fullName}</li>
      ))}
    </ul>
  );
};

export default CollaboratorList;