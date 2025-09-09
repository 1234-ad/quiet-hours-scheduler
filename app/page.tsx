import Link from 'next/link'
import { Clock, Calendar, Bell, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Quiet Hours Scheduler
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Create focused study time blocks and get notified 10 minutes before each session starts. 
          Stay organized and maintain your study routine.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/auth/login"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/dashboard"
            className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div className="text-center p-6 study-card">
          <Clock className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Time Blocks</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Create custom study time blocks that fit your schedule
          </p>
        </div>
        
        <div className="text-center p-6 study-card">
          <Bell className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Smart Notifications</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Get email reminders 10 minutes before each session
          </p>
        </div>
        
        <div className="text-center p-6 study-card">
          <Calendar className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Overlaps</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Intelligent scheduling prevents conflicting time blocks
          </p>
        </div>
        
        <div className="text-center p-6 study-card">
          <Shield className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Your data is protected with enterprise-grade security
          </p>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold mb-2">Create Account</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Sign up with your email and set up your profile
            </p>
          </div>
          
          <div className="p-6">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold mb-2">Schedule Sessions</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create your quiet study time blocks with custom durations
            </p>
          </div>
          
          <div className="p-6">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="text-lg font-semibold mb-2">Get Notified</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Receive email reminders 10 minutes before each session
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}