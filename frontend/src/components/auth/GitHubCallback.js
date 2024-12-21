import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import apiService from '../../services/api';

const GitHubCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleGitHubCallback = async () => {
      // Get the code from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          // Exchange code for token
          const response = await apiService.post('/auth/github', { code });
          
          if (response.data.token && response.data.user) {
            await login(response.data);
            navigate('/dashboard'); // Or wherever you want to redirect after login
          }
        } catch (error) {
          console.error('GitHub authentication failed:', error);
          navigate('/login?error=github_auth_failed');
        }
      } else {
        navigate('/login?error=no_code');
      }
    };

    handleGitHubCallback();
  }, [navigate, login]);

  return (
    <div className="github-callback">
      <h2>Processing GitHub Login...</h2>
      {/* Add a loading spinner here if you want */}
    </div>
  );
};

export default GitHubCallback; 