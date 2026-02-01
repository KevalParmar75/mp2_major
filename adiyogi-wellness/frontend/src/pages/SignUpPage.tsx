import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign Up failed");
      }

      // Save auth
      login(data.token, data.user);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Create session once
      if (!localStorage.getItem("session_id")) {
        const sid = "sess-" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("session_id", sid);
      }

      toast.success(`Welcome ${data.user.username}!`);

      // 🚀 Go straight to chat
      navigate("/chat");

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex w-full overflow-hidden">
      {/* Left */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
            <p className="text-muted-foreground">Join Adiyogi Wellness today</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input id="first_name" value={formData.first_name} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input id="last_name" value={formData.last_name} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Username</Label>
              <Input id="username" value={formData.username} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
            </Button>
          </form>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="hidden lg:flex w-1/2 bg-indigo-50 items-center justify-center">
        <img src="/assets/images/signup_visual.jpg" className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

export default SignUpPage;
