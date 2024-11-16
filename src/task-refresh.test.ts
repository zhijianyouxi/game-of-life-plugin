import { moment } from 'obsidian';
import { TaskTimeCalculator } from './utils';

describe('周期任务刷新逻辑测试', () => {
    // 固定时间用于测试
    const baseTime = moment('2024-01-01 10:00:00');
    
    describe('定时刷新测试', () => {
        test('每天特定时间刷新', () => {
            const task = {
                刷新方式: '定时',
                刷新时间: '每天8时',
                本次刷新时间: '2024-01-01 10:00:00'
            };
            const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
            expect(nextTime.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-02 08:00:00');
        });

        test('每周特定日期刷新', () => {
            const task = {
                刷新方式: '定时',
                刷新时间: '每周一',
                本次刷新时间: '2024-01-01 10:00:00' // 假设这是周一
            };
            const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
            expect(nextTime.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-08 05:00:00');
        });

        test('每月特定日期刷新', () => {
            const task = {
                刷新方式: '定时',
                刷新时间: '每月1日',
                本次刷新时间: '2024-01-01 10:00:00'
            };
            const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
            expect(nextTime.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-02-01 05:00:00');
        });
    });

    describe('固定间隔刷新测试', () => {
        describe('基于上次完成时间', () => {
            test('小时间隔', () => {
                const task = {
                    刷新方式: '固定间隔',
                    刷新间隔: '2小时',
                    刷新间隔起算时间: '上一次完成时间',
                    完成时间: '2024-01-01 10:00:00'
                };
                const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
                expect(nextTime.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-01 12:00:00');
            });

            test('天数间隔', () => {
                const task = {
                    刷新方式: '固定间隔',
                    刷新间隔: '3天',
                    刷新间隔起算时间: '上一次完成时间',
                    完成时间: '2024-01-01 10:00:00'
                };
                const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
                expect(nextTime.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-04 10:00:00');
            });
        });

        describe('基于上次刷新时间', () => {
            test('周间隔', () => {
                const task = {
                    刷新方式: '固定间隔',
                    刷新间隔: '2周',
                    刷新间隔起算时间: '上一次刷新时间',
                    本次刷新时间: '2024-01-01 10:00:00'
                };
                const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
                expect(nextTime.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-15 10:00:00');
            });

            test('月间隔', () => {
                const task = {
                    刷新方式: '固定间隔',
                    刷新间隔: '1月',
                    刷新间隔起算时间: '上一次刷新时间',
                    本次刷新时间: '2024-01-01 10:00:00'
                };
                const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
                expect(nextTime.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-02-01 10:00:00');
            });
        });
    });

    describe('每次指定时间测试', () => {
        test('应该返回null并等待用户输入', () => {
            const task = {
                刷新方式: '每次指定时间',
                本次刷新时间: '2024-01-01 10:00:00'
            };
            const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
            expect(nextTime).toBeNull();
        });
    });

    describe('边界情况测试', () => {
        test('月底日期处理', () => {
            const task = {
                刷新方式: '固定间隔',
                刷新间隔: '1月',
                刷新间隔起算时间: '上一次刷新时间',
                本次刷新时间: '2024-01-31 10:00:00'
            };
            const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
            expect(nextTime.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-02-29 10:00:00');
        });

        test('无效刷新时间格式', () => {
            const task = {
                刷新方式: '定时',
                刷新时间: '无效时间格式',
                本次刷新时间: '2024-01-01 10:00:00'
            };
            expect(() => TaskTimeCalculator.calculateNextRefreshTime(task)).toThrow();
        });

        test('跨年处理', () => {
            const task = {
                刷新方式: '固定间隔',
                刷新间隔: '1月',
                刷新间隔起算时间: '上一次刷新时间',
                本次刷新时间: '2024-12-31 10:00:00'
            };
            const nextTime = TaskTimeCalculator.calculateNextRefreshTime(task);
            expect(nextTime.format('YYYY-MM-DD HH:mm:ss')).toBe('2025-01-31 10:00:00');
        });
    });
}); 