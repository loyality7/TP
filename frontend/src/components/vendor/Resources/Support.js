import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { MessageCircle, Mail, Phone, Globe, Clock, ArrowRight } from 'lucide-react';

const Support = () => {
  const supportChannels = [
    {
      id: 1,
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: MessageCircle,
      action: 'Start Chat',
      availability: '24/7'
    },
    {
      id: 2,
      title: 'Email Support',
      description: 'Send us your queries via email',
      icon: Mail,
      action: 'Send Email',
      availability: '24-48 hours response'
    },
    {
      id: 3,
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      icon: Phone,
      action: 'Call Now',
      availability: 'Mon-Fri, 9AM-6PM'
    },
    {
      id: 4,
      title: 'Email Us Directly',
      description: 'Contact our support representative',
      icon: Mail,
      action: 'Email Gokul',
      availability: '24-48 hours response',
      link: 'mailto:gokul@hysteresis.in'
    },
    {
      id: 5,
      title: 'Visit Our Website',
      description: 'Find more resources on our website',
      icon: Globe,
      action: 'Visit Website',
      availability: 'Always available',
      link: 'https://hysteresis.in'
    }
  ];

  const faqs = [
    {
      question: 'How do I create my first assessment?',
      answer: 'Navigate to Assessments > Create New and follow our step-by-step guide.'
    },
    {
      question: 'How can I invite candidates?',
      answer: 'Go to Candidates section and click on "Invite Candidates" button.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers.'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Support Center</h1>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            New Support Ticket
          </button>
        </div>

        {/* Support Channels */}
        <div className="grid grid-cols-3 gap-6">
          {supportChannels.map((channel) => (
            <Card key={channel.id}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-emerald-100 rounded-lg mb-4">
                    <channel.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{channel.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{channel.description}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                    <Clock className="h-4 w-4" />
                    <span>{channel.availability}</span>
                  </div>
                  <a 
                    href={channel.link} 
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    {channel.action}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader className="border-b p-6">
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6">
                <h3 className="text-base font-medium text-gray-800 mb-2">{faq.question}</h3>
                <p className="text-sm text-gray-500">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Support; 