import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ambulance, Shield, Clock, MapPin, Phone, Zap, Heart, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Routing",
      description: "Intelligent route optimization using real-time traffic data to ensure fastest response times",
    },
    {
      icon: MapPin,
      title: "Real-Time Tracking",
      description: "Live ambulance location tracking with accurate ETA calculations for complete transparency",
    },
    {
      icon: Shield,
      title: "Flash Alert Network",
      description: "Automated alerts to nearby vehicles and hospitals ensuring smooth emergency response",
    },
    {
      icon: Clock,
      title: "Instant Dispatch",
      description: "Automated ambulance assignment based on proximity, availability, and traffic conditions",
    },
  ];

  const stats = [
    { label: "Avg Response Time", value: "6.2 min", icon: Clock },
    { label: "Active Ambulances", value: "24/7", icon: Ambulance },
    { label: "Lives Saved", value: "10,000+", icon: Heart },
    { label: "Coverage Area", value: "500+ km²", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Ambulance className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">SwiftAid</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              About
            </a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Contact
            </a>
            <Button size="sm" onClick={() => navigate("/auth")}>
              Sign In / Sign Up
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        
        <div className="container relative mx-auto px-4 py-24 md:py-32 text-center">
          <div className="mx-auto max-w-4xl">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-medium text-primary">Live 24/7 Emergency Service</span>
            </div>
            
            {/* Main heading with gradient */}
            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-7xl bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-fade-in">
              Emergency Response,
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text">Reimagined</span>
            </h1>
            
            <p className="mb-10 text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              AI-powered ambulance routing that saves lives. Every second counts—our intelligent system 
              ensures the <span className="font-semibold text-primary">fastest possible response</span> when you need it most.
            </p>
            
            {/* CTA Buttons with enhanced styling */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-12">
              <Button 
                size="lg" 
                className="gap-2 h-14 px-8 text-lg bg-destructive hover:bg-destructive/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                onClick={() => navigate("/emergency/book")}
              >
                <Phone className="h-5 w-5" />
                Book Emergency Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 text-lg border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                onClick={() => navigate("/auth")}
              >
                Sign In / Register
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-warning" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>6.2 min Avg Response</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="border-b py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-4">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                    <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-background"></div>
        <div className="container relative mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold">Why Choose SwiftAid?</h2>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground">
              Advanced technology meets compassionate care. Our platform revolutionizes emergency medical response
              through intelligent automation.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-primary/50 group relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="about" className="border-b py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold">How It Works</h2>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground">
              Simple, fast, and reliable emergency response in three steps
            </p>
          </div>
          <div className="grid gap-12 md:grid-cols-3 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
            
            <div className="text-center relative">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-primary-foreground shadow-lg relative z-10 animate-bounce">
                1
              </div>
              <h3 className="mb-3 text-2xl font-semibold">Request Emergency</h3>
              <p className="text-muted-foreground leading-relaxed">
                Book an ambulance through our platform with your location and emergency details
              </p>
            </div>
            <div className="text-center relative">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-primary-foreground shadow-lg relative z-10 animate-bounce" style={{ animationDelay: '0.2s' }}>
                2
              </div>
              <h3 className="mb-3 text-2xl font-semibold">AI Assignment</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI instantly assigns the nearest available ambulance with optimized routing
              </p>
            </div>
            <div className="text-center relative">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-primary-foreground shadow-lg relative z-10 animate-bounce" style={{ animationDelay: '0.4s' }}>
                3
              </div>
              <h3 className="mb-3 text-2xl font-semibold">Real-Time Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track your ambulance in real-time with live updates and accurate ETA
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-primary/10 to-accent/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-primary/5 to-transparent"></div>
        
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2">
              <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />
              <span className="text-sm font-medium text-destructive">Emergency Services Available 24/7</span>
            </div>
            
            <h2 className="mb-6 text-4xl md:text-5xl font-bold">
              Need Emergency Medical Transport?
            </h2>
            <p className="mb-10 text-xl md:text-2xl text-muted-foreground">
              Our team is standing by to provide rapid response emergency services
            </p>
            <Button 
              size="lg" 
              className="gap-2 h-16 px-10 text-lg bg-destructive hover:bg-destructive/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" 
              onClick={() => navigate("/emergency/book")}
            >
              <Phone className="h-6 w-6" />
              Book Emergency Ambulance Now
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-4xl font-bold">Get In Touch</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Have questions? Our support team is here to help 24/7
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Phone className="mx-auto h-8 w-8 text-primary" />
                  <CardTitle>Emergency Line</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">911</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Phone className="mx-auto h-8 w-8 text-primary" />
                  <CardTitle>Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">support@swiftaid.com</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 SwiftAid. All rights reserved. Saving lives through intelligent technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
