// Generate comprehensive mock data for all dashboards

function generateAdminDashboard(dateRange) {
  const summary = {
    totalWorkers: 1250,
    workersGrowth: 12.5,
    activeJobs: 342,
    jobsGrowth: 8.3,
    successfulPlacements: 89,
    placementsGrowth: 15.2,
    revenue: 12500000,
    revenueGrowth: 22.1,
    conversionRate: 68.5,
    averageTimeToHire: 45,
    topSkills: [
      { name: 'Construction', count: 245 },
      { name: 'Healthcare', count: 189 },
      { name: 'Agriculture', count: 156 },
      { name: 'Hospitality', count: 134 },
      { name: 'IT Support', count: 98 }
    ],
    employerSatisfaction: 4.6
  };

  const pipeline = [
    {
      stage: 'Document Verification',
      count: 156,
      avg_days: 3,
      conversion_rate: 95,
      drop_off_rate: 5,
      trend: 'up'
    },
    {
      stage: 'Skill Assessment',
      count: 142,
      avg_days: 7,
      conversion_rate: 88,
      drop_off_rate: 12,
      trend: 'stable'
    },
    {
      stage: 'Employer Review',
      count: 125,
      avg_days: 10,
      conversion_rate: 75,
      drop_off_rate: 25,
      trend: 'up'
    },
    {
      stage: 'Interview Scheduled',
      count: 94,
      avg_days: 5,
      conversion_rate: 70,
      drop_off_rate: 30,
      trend: 'stable'
    },
    {
      stage: 'Medical Examination',
      count: 66,
      avg_days: 7,
      conversion_rate: 95,
      drop_off_rate: 5,
      trend: 'up'
    },
    {
      stage: 'Visa Processing',
      count: 63,
      avg_days: 30,
      conversion_rate: 98,
      drop_off_rate: 2,
      trend: 'up'
    },
    {
      stage: 'Final Approval',
      count: 62,
      avg_days: 3,
      conversion_rate: 100,
      drop_off_rate: 0,
      trend: 'stable'
    }
  ];

  const financial = {
    revenueByCategory: [
      { month: 'Jan', revenue: 850000 },
      { month: 'Feb', revenue: 920000 },
      { month: 'Mar', revenue: 1100000 },
      { month: 'Apr', revenue: 1250000 },
      { month: 'May', revenue: 1350000 },
      { month: 'Jun', revenue: 1450000 }
    ],
    revenueByEmployer: [
      { name: 'Tech Solutions Israel', revenue: 3200000 },
      { name: 'Construction Plus', revenue: 2800000 },
      { name: 'Healthcare Group', revenue: 2400000 },
      { name: 'AgriCorp', revenue: 2100000 },
      { name: 'Hospitality Chain', revenue: 2000000 }
    ],
    paymentStatus: {
      paid: 85,
      pending: 12,
      overdue: 3
    },
    outstandingPayments: 450000,
    commissionAnalysis: {
      average: 8.5,
      total: 1062500
    }
  };

  const predictive = {
    successPredictions: {
      accuracy: 87.5,
      predictions: [
        { category: 'Construction', successRate: 92 },
        { category: 'Healthcare', successRate: 88 },
        { category: 'Agriculture', successRate: 85 }
      ]
    },
    riskAnalysis: [
      {
        risk_type: 'Document Verification Delay',
        probability: 0.15,
        impact: 'medium',
        severity: 'low'
      },
      {
        risk_type: 'Visa Processing Time',
        probability: 0.25,
        impact: 'high',
        severity: 'medium'
      }
    ],
    marketTrends: {
      demand: 'increasing',
      supply: 'stable',
      forecast: 'positive'
    },
    demandForecast: {
      nextMonth: 380,
      nextQuarter: 1150
    },
    confidence: 82
  };

  const realtime = {
    activeUsers: 156,
    applicationsToday: 23,
    interviewsScheduled: 12,
    documentsVerified: 45,
    systemHealth: 98.5
  };

  return {
    summary,
    pipeline,
    financial,
    predictive,
    realtime
  };
}

function generateEmployerDashboard(employerId) {
  const profile = {
    companyName: 'Tech Solutions Israel',
    registrationNumber: 'IL-123456',
    contactPerson: 'David Cohen',
    phone: '+972-2-123-4567',
    industry: 'Technology',
    companySize: '500-1000',
    verified: true
  };

  const jobs = {
    totalJobs: 15,
    activeJobs: 8,
    filledJobs: 5,
    totalApplications: 234,
    averageApplications: 15.6,
    jobs: [
      {
        id: 'job-1',
        title: 'Senior Software Developer',
        category: 'IT',
        location: 'Tel Aviv',
        applications: 45,
        approved: 8,
        rejected: 12,
        conversionRate: 17.8,
        status: 'active',
        created_at: '2024-01-15',
        trend: 'up'
      },
      {
        id: 'job-2',
        title: 'Construction Supervisor',
        category: 'Construction',
        location: 'Jerusalem',
        applications: 32,
        approved: 5,
        rejected: 8,
        conversionRate: 15.6,
        status: 'active',
        created_at: '2024-01-20',
        trend: 'stable'
      },
      {
        id: 'job-3',
        title: 'Healthcare Assistant',
        category: 'Healthcare',
        location: 'Haifa',
        applications: 28,
        approved: 6,
        rejected: 5,
        conversionRate: 21.4,
        status: 'filled',
        created_at: '2024-01-10',
        trend: 'up'
      }
    ]
  };

  const pipeline = {
    candidates: [
      {
        id: 'cand-1',
        job_id: 'job-1',
        job_title: 'Senior Software Developer',
        full_name: 'Rajesh Kumar',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience_years: 5,
        status: 'under_review',
        step_name: 'employer_review',
        step_status: 'in_progress',
        step_order: 3,
        profileScore: 85,
        days_in_stage: 5,
        riskLevel: { level: 'low', factors: [] }
      },
      {
        id: 'cand-2',
        job_id: 'job-2',
        job_title: 'Construction Supervisor',
        full_name: 'Amit Sharma',
        skills: ['Construction Management', 'Safety'],
        experience_years: 8,
        status: 'interviewed',
        step_name: 'interview_scheduled',
        step_status: 'completed',
        step_order: 4,
        profileScore: 92,
        days_in_stage: 2,
        riskLevel: { level: 'low', factors: [] }
      }
    ],
    stageDistribution: {
      'document_verification': 15,
      'skill_assessment': 12,
      'employer_review': 8,
      'interview_scheduled': 5
    },
    bottlenecks: ['employer_review']
  };

  const performance = {
    weeklyMetrics: [
      { week: 'Week 1', applications: 45, approvals: 8, avg_processing_days: 12 },
      { week: 'Week 2', applications: 52, approvals: 10, avg_processing_days: 11 },
      { week: 'Week 3', applications: 48, approvals: 9, avg_processing_days: 10 },
      { week: 'Week 4', applications: 55, approvals: 12, avg_processing_days: 9 }
    ],
    overall: {
      totalApplications: 200,
      totalApprovals: 39,
      averageProcessingTime: 10.5,
      approvalRate: 19.5
    }
  };

  const compliance = {
    status: 'Compliant',
    score: 95,
    requirements: [
      { name: 'Company Registration', status: 'completed' },
      { name: 'Labor License', status: 'completed' },
      { name: 'Insurance Coverage', status: 'completed' },
      { name: 'Workplace Safety', status: 'completed' },
      { name: 'Wage Compliance', status: 'pending' }
    ]
  };

  return {
    profile,
    jobs,
    pipeline,
    performance,
    compliance
  };
}

function generateWorkerDashboard(workerId) {
  const profile = {
    id: workerId,
    fullName: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '+91-9876543210',
    experience: 5,
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    location: 'Mumbai, India'
  };

  const applications = {
    total: 5,
    active: 3,
    approved: 1,
    rejected: 1,
    applications: [
      {
        id: 'app-1',
        job_id: 'job-1',
        title: 'Senior Software Developer',
        company_name: 'Tech Solutions Israel',
        status: 'under_review',
        applied_at: '2024-01-15',
        progress: 60,
        current_step: 'employer_review',
        nextStep: 'Complete employer interview',
        estimatedTimeline: {
          estimatedDays: 25,
          estimatedDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
        }
      },
      {
        id: 'app-2',
        job_id: 'job-2',
        title: 'Full Stack Developer',
        company_name: 'Startup Israel',
        status: 'approved',
        applied_at: '2024-01-10',
        progress: 100,
        current_step: 'final_approval',
        nextStep: 'Travel arrangements',
        estimatedTimeline: {
          estimatedDays: 5,
          estimatedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        }
      },
      {
        id: 'app-3',
        job_id: 'job-3',
        title: 'React Developer',
        company_name: 'Tech Corp',
        status: 'submitted',
        applied_at: '2024-01-20',
        progress: 30,
        current_step: 'skill_assessment',
        nextStep: 'Complete skill assessment',
        estimatedTimeline: {
          estimatedDays: 40,
          estimatedDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000)
        }
      }
    ]
  };

  const documents = {
    total: 7,
    verified: 5,
    pending: 1,
    missing: 1,
    rejected: 0,
    documents: [
      {
        type: 'passport',
        name: 'Passport',
        status: 'verified',
        description: 'Valid passport with minimum 2 years validity',
        urgency: 'low'
      },
      {
        type: 'resume',
        name: 'Resume/CV',
        status: 'verified',
        description: 'Updated resume with complete work history',
        urgency: 'low'
      },
      {
        type: 'education_certificate',
        name: 'Education Certificate',
        status: 'verified',
        description: 'Highest education qualification certificate',
        urgency: 'low'
      },
      {
        type: 'experience_certificate',
        name: 'Experience Certificate',
        status: 'verified',
        description: 'Work experience certificates from previous employers',
        urgency: 'low'
      },
      {
        type: 'medical_certificate',
        name: 'Medical Certificate',
        status: 'pending',
        description: 'Medical fitness certificate from authorized doctor',
        urgency: 'high'
      },
      {
        type: 'police_clearance',
        name: 'Police Clearance',
        status: 'verified',
        description: 'Police clearance certificate from local authorities',
        urgency: 'low'
      },
      {
        type: 'skill_certificate',
        name: 'Skill Certificate',
        status: 'missing',
        description: 'NSDC or equivalent skill certification',
        urgency: 'medium'
      }
    ]
  };

  const timeline = {
    currentStep: 'employer_review',
    currentStepIndex: 3,
    overallProgress: 60,
    milestones: [
      {
        title: 'Document Verification',
        completed: true,
        completedAt: '2024-01-16',
        estimatedDate: '2024-01-18'
      },
      {
        title: 'Skill Assessment',
        completed: true,
        completedAt: '2024-01-20',
        estimatedDate: '2024-01-22'
      },
      {
        title: 'Employer Review',
        completed: false,
        estimatedDate: '2024-02-05'
      },
      {
        title: 'Interview Scheduled',
        completed: false,
        estimatedDate: '2024-02-10'
      },
      {
        title: 'Medical Examination',
        completed: false,
        estimatedDate: '2024-02-15'
      },
      {
        title: 'Visa Processing',
        completed: false,
        estimatedDate: '2024-03-15'
      },
      {
        title: 'Final Approval',
        completed: false,
        estimatedDate: '2024-03-18'
      }
    ],
    upcomingDeadlines: [
      {
        description: 'Complete employer interview by Feb 5, 2024',
        date: '2024-02-05',
        priority: 'high'
      }
    ],
    estimatedCompletion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
  };

  const skills = {
    currentSkills: {
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      certifications: ['NSDC Full Stack Developer'],
      languages: ['English', 'Hindi'],
      experience_years: 5,
      education: 'B.Tech Computer Science'
    },
    marketDemand: [
      { skill: 'React', demand: 'high', jobs: 45 },
      { skill: 'Node.js', demand: 'high', jobs: 38 },
      { skill: 'JavaScript', demand: 'very_high', jobs: 67 }
    ],
    skillGaps: [
      { skill: 'TypeScript', priority: 'medium', impact: 'medium' },
      { skill: 'AWS', priority: 'high', impact: 'high' }
    ],
    recommendations: [
      {
        title: 'TypeScript Fundamentals',
        provider: 'NSDC',
        duration: '4 weeks',
        category: 'Programming',
        skillPoints: 15,
        url: '#'
      },
      {
        title: 'AWS Cloud Practitioner',
        provider: 'AWS Training',
        duration: '6 weeks',
        category: 'Cloud',
        skillPoints: 25,
        url: '#'
      }
    ],
    skillScore: 78,
    improvementPlan: {
      immediate: [
        { skill: 'TypeScript', timeline: '1 month' }
      ],
      shortTerm: [
        { skill: 'AWS', timeline: '2 months' }
      ],
      estimatedTimeline: '3-6 months',
      expectedImpact: 'Increase placement chances by 40%'
    }
  };

  const notifications = [
    {
      id: 'notif-1',
      title: 'Interview Scheduled',
      message: 'Your interview for Senior Software Developer is scheduled for Feb 5, 2024',
      priority: 'high',
      timestamp: new Date()
    },
    {
      id: 'notif-2',
      title: 'Document Verification',
      message: 'Your passport has been verified successfully',
      priority: 'medium',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ];

  const resources = [
    {
      title: 'Visa Application Guide',
      type: 'guide',
      url: '#'
    },
    {
      title: 'Interview Preparation Tips',
      type: 'article',
      url: '#'
    }
  ];

  return {
    profile,
    applications,
    documents,
    timeline,
    skills,
    notifications,
    resources
  };
}

module.exports = {
  generateAdminDashboard,
  generateEmployerDashboard,
  generateWorkerDashboard
};
