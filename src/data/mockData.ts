import { Intersection, WaitRecord, Direction, TimePeriod, Tag } from '@/types';

export const mockIntersections: Intersection[] = [
  {
    id: 'int_001',
    name: '人民大道与中山街交叉口',
    area: '市中心',
    note: '主要商业区路口',
    createdAt: '2025-01-15T08:00:00.000Z',
  },
  {
    id: 'int_002',
    name: '长安街与建国路交叉口',
    area: '东城区',
    note: '早高峰拥堵严重',
    createdAt: '2025-01-16T09:30:00.000Z',
  },
  {
    id: 'int_003',
    name: '解放大道与和平路交叉口',
    area: '西城区',
    note: '学校附近，上下学时段拥堵',
    createdAt: '2025-01-17T14:20:00.000Z',
  },
  {
    id: 'int_004',
    name: '科技大道与创新路交叉口',
    area: '高新区',
    note: '产业园核心区域',
    createdAt: '2025-01-18T11:00:00.000Z',
  },
  {
    id: 'int_005',
    name: '滨河路与园林街交叉口',
    area: '南城区',
    note: '靠近公园，周末人流大',
    createdAt: '2025-01-19T16:45:00.000Z',
  },
  {
    id: 'int_006',
    name: '火车站前广场路口',
    area: '火车站',
    note: '交通枢纽，全天流量大',
    createdAt: '2025-01-20T10:15:00.000Z',
  },
];

function generateMockRecords(): WaitRecord[] {
  const records: WaitRecord[] = [];
  const directions: Direction[] = ['east', 'south', 'west', 'north'];
  const tags: (Tag | undefined)[] = ['rushing', 'pickup', 'commute', 'school', 'shopping', 'leisure', undefined, undefined];
  const noteOptions: (string | undefined)[] = [
    '红灯太长了',
    '今天特别堵',
    '又是这个路口',
    undefined, undefined, undefined,
  ];
  const now = new Date();

  for (let i = 0; i < 60; i++) {
    const intersection = mockIntersections[Math.floor(Math.random() * mockIntersections.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const hour = 6 + Math.floor(Math.random() * 16);
    const minute = Math.floor(Math.random() * 60);
    const duration = 30 + Math.floor(Math.random() * 150);
    const tag = tags[Math.floor(Math.random() * tags.length)];
    const note = noteOptions[Math.floor(Math.random() * noteOptions.length)];

    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() - daysAgo);
    startTime.setHours(hour, minute, 0, 0);

    const endTime = new Date(startTime.getTime() + duration * 1000);

    let timePeriod: TimePeriod;
    if (hour >= 7 && hour < 9) {
      timePeriod = 'morning_peak';
    } else if (hour >= 17 && hour < 19) {
      timePeriod = 'evening_peak';
    } else if (hour >= 6 && hour < 22) {
      timePeriod = 'flat';
    } else {
      timePeriod = 'night';
    }

    records.push({
      id: `rec_${1000 + i}`,
      intersectionId: intersection.id,
      intersectionName: intersection.name,
      direction,
      duration,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      timePeriod,
      tag,
      note,
    });
  }

  return records.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export const mockRecords: WaitRecord[] = generateMockRecords();
