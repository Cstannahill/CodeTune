import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      alert("Login successful");
      navigate("/");
    } else {
      alert("Invalid credentials");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin(e);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pr-10"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted">
                →
              </span>
            </div>
            <div className="relative w-full">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pr-10"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted">
                →
              </span>
            </div>
            <Button type="submit" className="w-full py-2 text-sm">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/register" className="text-primary">
              Register
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
