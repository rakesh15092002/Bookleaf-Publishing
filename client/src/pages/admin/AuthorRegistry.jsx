import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';

const AuthorRegistry = () => {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await adminAPI.getAuthors();
        const authorsData = response.data?.data;
        setAuthors(Array.isArray(authorsData) ? authorsData : []);
      } catch (error) {
        console.error('Error fetching authors:', error);
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  if (loading) return <Layout title="Author Registry"><div>Loading...</div></Layout>;

  return (
    <Layout title="Author Registry">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(Array.isArray(authors) ? authors : []).map((author) => (
              <tr
                key={author.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => navigate(`/admin/authors/${author.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">{author.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{author.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(`/admin/authors/${author.id}`)
                    }}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-500 shadow-md shadow-cyan-200 transition duration-200 hover:from-sky-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-300 cursor-pointer"
                  >
                    Show author details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AuthorRegistry;