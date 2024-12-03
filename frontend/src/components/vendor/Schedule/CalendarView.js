import React, { useState } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const CalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const events = [
    {
      id: 1,
      title: 'Frontend Developer Test',
      date: '2024-03-20',
      time: '10:00 AM',
      candidates: 15
    },
    {
      id: 2,
      title: 'Python Programming',
      date: '2024-03-21',
      time: '2:00 PM',
      candidates: 8
    }
  ];

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  };

  return (
    <Layout>
      <div className="space-y-6 relative">
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-2xl font-semibold text-gray-800">Coming Soon</div>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Calendar</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-50 rounded-full"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-500" />
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-50 rounded-full"
                >
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* Day Names */}
              {dayNames.map((day) => (
                <div key={day} className="bg-white p-4 text-sm font-medium text-gray-500 text-center">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-white p-4" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const date = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = events.filter(event => event.date === date);

                return (
                  <div key={day} className="bg-white p-4 min-h-[120px] border-t">
                    <div className="font-medium text-gray-800 mb-2">{day}</div>
                    {dayEvents.map(event => (
                      <div 
                        key={event.id}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded text-sm mb-1"
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs">{event.time}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CalendarView; 