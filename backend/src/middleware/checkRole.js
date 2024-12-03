export const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        console.log('Checking role:', { userRole: req.user.role, requiredRoles });

        if (!requiredRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Not authorized for this action",
                details: {
                    requiredRoles
                }
            });
        }
        next();
    };
};