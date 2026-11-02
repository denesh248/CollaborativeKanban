import React, { useState } from 'react';
import Layout from './components/Layout.jsx';
import LoginPlaceholder from './components/LoginPlaceholder.jsx';
import Overview from './components/Overview.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'login' ? <LoginPlaceholder /> : <Overview />}
    </Layout>
  );
}
