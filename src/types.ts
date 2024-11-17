export enum RefreshType {
    Manual = '每次指定时间',
    Interval = '固定间隔',
    Scheduled = '定时'
}

export enum RefreshTimeBase {
    LastRefresh = '上次刷新时间',
    LastCompletion = '上次完成时间'
}

export interface TaskData {
    uuid: string;
    刷新方式: RefreshType;
    刷新间隔?: string;
    刷新时间?: string;
    刷新间隔起算时间?: RefreshTimeBase;
    本次刷新时间?: string;
    下一次刷新时间?: string;
    本次任务完成情况?: string;
} 