const express = require('express');
const router = express.Router();

// Generate mock jobs data
function generateJobsByCategory(category) {
  const baseJobs = [
    {
      id: 1,
      title: `${category} Worker - Tel Aviv`,
      company: 'Construction Group Ltd',
      location: 'Tel Aviv, Israel',
      salary: '₹80,000 - ₹1,20,000',
      experience: '2-5 years',
      type: 'Full-time',
      posted: '2 days ago',
      description: `We are looking for experienced ${category} workers to join our team in Tel Aviv. Must have relevant experience and certifications.`,
      requirements: ['Minimum 2 years experience', 'Valid work permit', 'Physical fitness certificate'],
      category: category,
      openings: 15
    },
    {
      id: 2,
      title: `Senior ${category} - Jerusalem`,
      company: 'BuildCorp Israel',
      location: 'Jerusalem, Israel',
      salary: '₹1,00,000 - ₹1,50,000',
      experience: '5-10 years',
      type: 'Full-time',
      posted: '1 week ago',
      description: `Senior ${category} position available in Jerusalem. Leadership experience preferred.`,
      requirements: ['5+ years experience', 'Leadership skills', 'Safety certifications'],
      category: category,
      openings: 8
    },
    {
      id: 3,
      title: `${category} Assistant - Haifa`,
      company: 'Israel Construction Co',
      location: 'Haifa, Israel',
      salary: '₹70,000 - ₹1,00,000',
      experience: '1-3 years',
      type: 'Full-time',
      posted: '3 days ago',
      description: `Entry-level ${category} position in Haifa. Training will be provided.`,
      requirements: ['Basic experience', 'Willingness to learn', 'Team player'],
      category: category,
      openings: 12
    },
    {
      id: 4,
      title: `${category} Specialist - Netanya`,
      company: 'Premium Builders',
      location: 'Netanya, Israel',
      salary: '₹90,000 - ₹1,30,000',
      experience: '3-7 years',
      type: 'Full-time',
      posted: '5 days ago',
      description: `Specialized ${category} role with competitive salary and benefits.`,
      requirements: ['Specialized skills', 'Certifications', '3+ years experience'],
      category: category,
      openings: 6
    },
    {
      id: 5,
      title: `${category} Team Lead - Beer Sheva`,
      company: 'Southern Construction',
      location: 'Beer Sheva, Israel',
      salary: '₹1,20,000 - ₹1,80,000',
      experience: '7+ years',
      type: 'Full-time',
      posted: '1 week ago',
      description: `Lead ${category} team in Beer Sheva. Management experience required.`,
      requirements: ['7+ years experience', 'Management skills', 'Team leadership'],
      category: category,
      openings: 4
    },
  ];

  // Add more jobs based on category
  const additionalJobs = [];
  for (let i = 6; i <= 20; i++) {
    const cities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Netanya', 'Ashdod', 'Rishon LeZion'];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const salaryRanges = [
      { min: 70000, max: 100000 },
      { min: 80000, max: 120000 },
      { min: 100000, max: 150000 },
    ];
    const salaryRange = salaryRanges[Math.floor(Math.random() * salaryRanges.length)];
    
    additionalJobs.push({
      id: i,
      title: `${category} Worker - ${randomCity}`,
      company: `Company ${i}`,
      location: `${randomCity}, Israel`,
      salary: `₹${salaryRange.min.toLocaleString()} - ₹${salaryRange.max.toLocaleString()}`,
      experience: `${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 5) + 5} years`,
      type: 'Full-time',
      posted: `${Math.floor(Math.random() * 7) + 1} days ago`,
      description: `We are hiring ${category} workers for our ${randomCity} location.`,
      requirements: ['Relevant experience', 'Work permit', 'Physical fitness'],
      category: category,
      openings: Math.floor(Math.random() * 10) + 3
    });
  }

  return [...baseJobs, ...additionalJobs];
}

function generateJobsBySearch(searchTerm) {
  // Map search terms to categories
  const searchToCategory = {
    'Jobs for Freshers': 'Entry Level',
    'Work from Home Jobs': 'Remote',
    'Part Time Jobs': 'Part-time',
    'Jobs for Women': 'All',
    'Full Time Jobs': 'Full-time',
  };

  const category = searchToCategory[searchTerm] || 'All';
  
  // Generate jobs based on search term
  const jobs = [];
  const jobTitles = [
    'Construction Worker', 'Healthcare Assistant', 'Agriculture Worker',
    'Hospitality Staff', 'IT Support', 'Nursing Staff', 'Electrician',
    'Plumber', 'Carpenter', 'Welder', 'Driver', 'Security Guard'
  ];

  for (let i = 1; i <= 25; i++) {
    const randomTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const cities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Netanya', 'Ashdod'];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const salaryRanges = [
      { min: 70000, max: 100000 },
      { min: 80000, max: 120000 },
      { min: 100000, max: 150000 },
    ];
    const salaryRange = salaryRanges[Math.floor(Math.random() * salaryRanges.length)];

    jobs.push({
      id: i,
      title: randomTitle,
      company: `Company ${i}`,
      location: `${randomCity}, Israel`,
      salary: `₹${salaryRange.min.toLocaleString()} - ₹${salaryRange.max.toLocaleString()}`,
      experience: category === 'Entry Level' ? '0-2 years' : `${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 5) + 5} years`,
      type: category === 'Part-time' ? 'Part-time' : category === 'Remote' ? 'Remote' : 'Full-time',
      posted: `${Math.floor(Math.random() * 7) + 1} days ago`,
      description: `Job opportunity for ${randomTitle} in ${randomCity}.`,
      requirements: ['Relevant experience', 'Work permit'],
      category: category,
      openings: Math.floor(Math.random() * 10) + 3
    });
  }

  return jobs;
}

// Get jobs by category
router.get('/category/:category', (req, res) => {
  const { category } = req.params;
  const jobs = generateJobsByCategory(category);
  res.json({
    success: true,
    data: {
      category,
      totalJobs: jobs.length,
      jobs
    }
  });
});

// Get jobs by search term
router.get('/search/:searchTerm', (req, res) => {
  const { searchTerm } = req.params;
  const decodedSearchTerm = decodeURIComponent(searchTerm);
  const jobs = generateJobsBySearch(decodedSearchTerm);
  res.json({
    success: true,
    data: {
      searchTerm: decodedSearchTerm,
      totalJobs: jobs.length,
      jobs
    }
  });
});

// Get all jobs
router.get('/all', (req, res) => {
  const { category, search } = req.query;
  
  let jobs = [];
  if (category) {
    jobs = generateJobsByCategory(category);
  } else if (search) {
    jobs = generateJobsBySearch(search);
  } else {
    // Return jobs from all categories
    const categories = ['Construction', 'Healthcare', 'Agriculture', 'Hospitality', 'IT Support', 'Nursing', 'Plumber', 'Electrician'];
    categories.forEach(cat => {
      jobs = [...jobs, ...generateJobsByCategory(cat).slice(0, 5)];
    });
  }

  res.json({
    success: true,
    data: {
      totalJobs: jobs.length,
      jobs
    }
  });
});

// Post a new job
router.post('/create', (req, res) => {
  try {
    const {
      title,
      company,
      location,
      salary,
      experience,
      type,
      description,
      requirements,
      category,
      openings
    } = req.body;

    // Validate required fields
    if (!title || !company || !location || !salary || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create new job object
    const newJob = {
      id: Date.now(), // Simple ID generation
      title,
      company: company || 'Your Company',
      location,
      salary,
      experience: experience || 'Not specified',
      type: type || 'Full-time',
      posted: 'Just now',
      description,
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []),
      category,
      openings: openings || 1,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // In a real application, you would save this to a database
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Job posted successfully',
      data: newJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job'
    });
  }
});

module.exports = router;
