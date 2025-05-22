import React from "react";
import { Layout } from "antd";
const { Footer: AntFooter } = Layout;

export default function Footer() {
  return (
    <AntFooter style={{ textAlign: "center" }}>
      © 2025 - kicks Dashboard | <a href="#">About</a> | <a href="#">Careers</a>{" "}
      | <a href="#">Policy</a> | <a href="#">Contact</a>
    </AntFooter>
  );
}
