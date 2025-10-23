// Role-based authorization middleware
export const projectManagerOnly = (req, res, next) => {
  if (req.user.role !== 'project_manager') {
    return res.status(403).json({ 
      message: 'Access denied: Project Manager routes only' 
    });
  }
  next();
};

export const teamLeadOnly = (req, res, next) => {
  if (req.user.role !== 'team_lead') {
    return res.status(403).json({ 
      message: 'Access denied: Team Lead routes only' 
    });
  }
  next();
};

export const teamMemberOnly = (req, res, next) => {
  if (req.user.role !== 'team_member') {
    return res.status(403).json({ 
      message: 'Access denied: Team Member routes only' 
    });
  }
  next();
};

// Allow multiple roles
export const allowRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: ${roles.join('/')} roles only`
      });
    }
    next();
  };
};