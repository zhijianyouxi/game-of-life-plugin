import { moment } from 'obsidian';

export class TaskTimeCalculator {
    static parseInterval(intervalStr: string): { value: number; unit: string } {
        const match = intervalStr.match(/(\d+)(小时|天|周|月)/);
        if (!match) throw new Error('无效的刷新间隔格式');
        return {
            value: parseInt(match[1]),
            unit: match[2]
        };
    }

    static parseScheduledTime(timeStr: string): moment.Moment {
        const now = moment();
        
        if (timeStr.startsWith('每天')) {
            const hour = parseInt(timeStr.match(/每天(\d+)时/)?.[1] || '5');
            let next = moment().hour(hour).minute(0).second(0);
            if (next.isSameOrBefore(now)) {
                next = next.add(1, 'day');
            }
            return next;
        }
        
        if (timeStr.startsWith('每周')) {
            const dayMap = {
                '一': 1, '二': 2, '三': 3, '四': 4,
                '五': 5, '六': 6, '日': 0
            };
            const day = dayMap[timeStr.charAt(2)];
            let next = moment().day(day).hour(5).minute(0).second(0);
            if (next.isSameOrBefore(now)) {
                next = next.add(1, 'week');
            }
            return next;
        }
        
        if (timeStr.startsWith('每月')) {
            const date = parseInt(timeStr.match(/每月(\d+)日/)?.[1] || '1');
            let next = moment().date(date).hour(5).minute(0).second(0);
            if (next.isSameOrBefore(now)) {
                next = next.add(1, 'month');
            }
            return next;
        }
        
        throw new Error('无效的刷新时间格式');
    }

    static addInterval(baseTime: moment.Moment, intervalStr: string): moment.Moment {
        const { value, unit } = this.parseInterval(intervalStr);
        const unitMap = {
            '小时': 'hours',
            '天': 'days',
            '周': 'weeks',
            '月': 'months'
        };
        return moment(baseTime).add(value, unitMap[unit]);
    }
} 