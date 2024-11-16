export enum RefreshType {
    Scheduled = '定时',
    Interval = '固定间隔',
    Manual = '每次指定时间'
}

export enum RefreshTimeBase {
    LastCompletion = '上一次完成时间',
    LastRefresh = '上一次刷新时间'
}

export interface TaskData {
    刷新方式: RefreshType;
    刷新间隔?: string;  // "2小时" "3天" "1周" "1月"
    刷新间隔起算时间?: RefreshTimeBase;
    刷新时间?: string;  // "每天8时" "每周一" "每月1日"
    下一次刷新时间?: string;
    本次刷新时间?: string;
    任务状态: string;
    本次任务完成情况: string;
    uuid: string;
} 