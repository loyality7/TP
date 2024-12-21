import React, { useState, useEffect } from 'react';
import SideBar from './SideBar';
import { userService } from '../../services/user.service';

const Profile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    education: [{ degree: '', institution: '', year: '' }],
    experience: [{ title: '', company: '', years: 0 }],
    skills: [{ name: '', level: '' }]
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        education: data.education?.length ? data.education : [{ degree: '', institution: '', year: '' }],
        experience: data.experience?.length ? data.experience : [{ title: '', company: '', years: 0 }],
        skills: data.skills?.length ? data.skills.map(s => ({ name: s, level: '' })) : [{ name: '', level: '' }]
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, index, section) => {
    const { name, value } = e.target;
    if (section) {
      const newData = [...formData[section]];
      newData[index] = { ...newData[index], [name]: value };
      setFormData({ ...formData, [section]: newData });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addItem = (section) => {
    const newItems = {
      education: { degree: '', institution: '', year: '' },
      experience: { title: '', company: '', years: 0 },
      skills: { name: '', level: '' }
    };
    setFormData({
      ...formData,
      [section]: [...formData[section], newItems[section]]
    });
  };

  const removeItem = (index, section) => {
    setFormData({
      ...formData,
      [section]: formData[section].filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await userService.updateFullProfile(formData);
      setProfile(response);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : ''} transition-margin duration-200 overflow-y-auto`}>
        <div className="p-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-medium mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange(e)}
                    placeholder="Name"
                    className="border rounded p-2"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange(e)}
                    placeholder="Email"
                    className="border rounded p-2"
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange(e)}
                    placeholder="Phone"
                    className="border rounded p-2"
                  />
                </div>
              </div>

              {/* Skills Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">Skills</h2>
                  <button
                    type="button"
                    onClick={() => addItem('skills')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    + Add Skill
                  </button>
                </div>
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex gap-4 mb-2">
                    <input
                      type="text"
                      name="name"
                      value={skill.name}
                      onChange={(e) => handleInputChange(e, index, 'skills')}
                      placeholder="Skill name"
                      className="border rounded p-2 flex-1"
                    />
                    <select
                      name="level"
                      value={skill.level}
                      onChange={(e) => handleInputChange(e, index, 'skills')}
                      className="border rounded p-2"
                    >
                      <option value="">Select Level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeItem(index, 'skills')}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Education Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">Education</h2>
                  <button
                    type="button"
                    onClick={() => addItem('education')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    + Add Education
                  </button>
                </div>
                {formData.education.map((edu, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 mb-4">
                    <input
                      type="text"
                      name="degree"
                      value={edu.degree}
                      onChange={(e) => handleInputChange(e, index, 'education')}
                      placeholder="Degree"
                      className="border rounded p-2"
                    />
                    <input
                      type="text"
                      name="institution"
                      value={edu.institution}
                      onChange={(e) => handleInputChange(e, index, 'education')}
                      placeholder="Institution"
                      className="border rounded p-2"
                    />
                    <input
                      type="text"
                      name="year"
                      value={edu.year}
                      onChange={(e) => handleInputChange(e, index, 'education')}
                      placeholder="Year"
                      className="border rounded p-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index, 'education')}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Experience Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">Experience</h2>
                  <button
                    type="button"
                    onClick={() => addItem('experience')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    + Add Experience
                  </button>
                </div>
                {formData.experience.map((exp, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 mb-4">
                    <input
                      type="text"
                      name="title"
                      value={exp.title}
                      onChange={(e) => handleInputChange(e, index, 'experience')}
                      placeholder="Title"
                      className="border rounded p-2"
                    />
                    <input
                      type="text"
                      name="company"
                      value={exp.company}
                      onChange={(e) => handleInputChange(e, index, 'experience')}
                      placeholder="Company"
                      className="border rounded p-2"
                    />
                    <input
                      type="number"
                      name="years"
                      value={exp.years}
                      onChange={(e) => handleInputChange(e, index, 'experience')}
                      placeholder="Years"
                      className="border rounded p-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index, 'experience')}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-medium">{profile.name}</h2>
                <p className="text-gray-600">{profile.email}</p>
                {profile.phone && <p className="text-gray-600">{profile.phone}</p>}
                
                {/* Skills Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium">Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Education Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium">Education</h3>
                  {profile.education?.map((edu, index) => (
                    <div key={index} className="mt-2">
                      <p className="font-medium">{edu.degree}</p>
                      <p className="text-gray-600">{edu.institution} - {edu.year}</p>
                    </div>
                  ))}
                </div>

                {/* Experience Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium">Experience</h3>
                  {profile.experience?.map((exp, index) => (
                    <div key={index} className="mt-2">
                      <p className="font-medium">{exp.title}</p>
                      <p className="text-gray-600">{exp.company} - {exp.years} years</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;