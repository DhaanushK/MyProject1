import moment from 'moment-timezone';

/**
 * Middleware to validate date restrictions for data entry
 */
class DateValidator {
    /**
     * Check if a date is today (in IST timezone)
     */
    static isToday(date) {
        const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
        const inputDate = moment(date).format('YYYY-MM-DD');
        return today === inputDate;
    }

    /**
     * Check if a date is in the past
     */
    static isPastDate(date) {
        const today = moment().tz('Asia/Kolkata').startOf('day');
        const inputDate = moment(date).startOf('day');
        return inputDate.isBefore(today);
    }

    /**
     * Check if a date is in the future
     */
    static isFutureDate(date) {
        const today = moment().tz('Asia/Kolkata').startOf('day');
        const inputDate = moment(date).startOf('day');
        return inputDate.isAfter(today);
    }

    /**
     * Get current date in IST
     */
    static getCurrentDate() {
        return moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    }

    /**
     * Check if date is yesterday (for team leads)
     */
    static isYesterday(date) {
        const yesterday = moment().tz('Asia/Kolkata').subtract(1, 'day').format('YYYY-MM-DD');
        const inputDate = moment(date).format('YYYY-MM-DD');
        return yesterday === inputDate;
    }

    /**
     * Middleware to validate date for data entry
     */
    static validateDateForEntry(req, res, next) {
        try {
            const { date } = req.body;
            
            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: 'Date is required',
                    error: 'MISSING_DATE'
                });
            }

            // Check if date is valid
            if (!moment(date).isValid()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format. Use YYYY-MM-DD format.',
                    error: 'INVALID_DATE_FORMAT'
                });
            }

            // Check if trying to edit past date
            if (DateValidator.isPastDate(date)) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot edit data for past dates. You can only edit data for today.',
                    error: 'PAST_DATE_NOT_ALLOWED',
                    currentDate: DateValidator.getCurrentDate(),
                    attemptedDate: date
                });
            }

            // Check if trying to edit future date
            if (DateValidator.isFutureDate(date)) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot edit data for future dates. You can only edit data for today.',
                    error: 'FUTURE_DATE_NOT_ALLOWED',
                    currentDate: DateValidator.getCurrentDate(),
                    attemptedDate: date
                });
            }

            // If we reach here, the date is today - proceed
            next();
        } catch (error) {
            console.error('Date validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error validating date',
                error: error.message
            });
        }
    }

    /**
     * Special validation for team leads (can edit yesterday's data)
     */
    static validateDateForTeamLead(req, res, next) {
        try {
            const { date } = req.body;
            const userRole = req.user?.role;

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: 'Date is required',
                    error: 'MISSING_DATE'
                });
            }

            // Check if date is valid
            if (!moment(date).isValid()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format. Use YYYY-MM-DD format.',
                    error: 'INVALID_DATE_FORMAT'
                });
            }

            // Check if trying to edit future date
            if (DateValidator.isFutureDate(date)) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot edit data for future dates.',
                    error: 'FUTURE_DATE_NOT_ALLOWED',
                    currentDate: DateValidator.getCurrentDate(),
                    attemptedDate: date
                });
            }

            // Team leads can edit today or yesterday
            const isToday = DateValidator.isToday(date);
            const isYesterday = DateValidator.isYesterday(date);
            
            if (userRole === 'team_lead') {
                if (!isToday && !isYesterday) {
                    return res.status(403).json({
                        success: false,
                        message: 'Team leads can only edit today\'s and yesterday\'s data.',
                        error: 'DATE_NOT_ALLOWED',
                        currentDate: DateValidator.getCurrentDate(),
                        attemptedDate: date,
                        userRole: userRole
                    });
                }
            } else {
                // Regular users can only edit today
                if (!isToday) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only edit data for today.',
                        error: 'DATE_NOT_ALLOWED',
                        currentDate: DateValidator.getCurrentDate(),
                        attemptedDate: date,
                        userRole: userRole
                    });
                }
            }

            next();
        } catch (error) {
            console.error('Date validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error validating date',
                error: error.message
            });
        }
    }

    /**
     * Get date status for a specific date and user role
     */
    static getDateStatus(date, userRole) {
        const isToday = DateValidator.isToday(date);
        const isPast = DateValidator.isPastDate(date);
        const isFuture = DateValidator.isFutureDate(date);
        const isYesterday = DateValidator.isYesterday(date);
        
        let canEdit = false;
        let reason = '';
        
        if (isFuture) {
            canEdit = false;
            reason = 'Future dates cannot be edited';
        } else if (isToday) {
            canEdit = true;
            reason = 'Current date - editable';
        } else if (isPast) {
            if (userRole === 'team_lead' && isYesterday) {
                canEdit = true;
                reason = 'Team lead can edit yesterday\'s data';
            } else if (userRole === 'team_lead') {
                canEdit = false;
                reason = 'Team leads can only edit today and yesterday';
            } else {
                canEdit = false;
                reason = 'Past dates cannot be edited';
            }
        }
        
        return {
            canEdit,
            reason,
            dateStatus: {
                isToday,
                isPast,
                isFuture,
                isYesterday
            }
        };
    }
}

export default DateValidator;