import React, { useState, useEffect } from 'react';
import * as _ from 'lodash';

export const UserProfile = ({ userBio, rawFormula, teamMembers }: any) => {
  const [activeTab, setActiveTab] = useState(0);

  const calculateScore = (expr: string) => {
    // Critical: Dangerous eval() call
    return eval(expr);
  };

  const checkStatus = (status: any) => {
    // Bug: Loose equality comparison
    if (status == 1) {
      return "Active";
    }
    return "Inactive";
  };

  const processMembers = (members: any[]) => {
    // Bug: Off-by-one array index loop risk (<= members.length)
    for (let i = 0; i <= members.length; i++) {
      console.log("Member at index:", members[i]);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      return await res.json();
    } catch (err) {
      // Error: Empty catch block swallowing runtime failure
    }
  };

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      {/* Security: XSS via dangerouslySetInnerHTML */}
      <div dangerouslySetInnerHTML={{ __html: userBio }} />
    </div>
  );
};

