import React from "react";
import { Typography, Button } from "antd";

const { Title, Paragraph } = Typography;

const JoinClub = () => {
  return (
    <div className="club-box">
      <Title level={3}>Join Kicks Club Get Rewarded Today.</Title>
      <Paragraph className="club-paragraph">
        As a kicks club member you get rewarded with what you love for doing
        what you love. Sign up Today and receive immediate access to these Level
        1 benefits:
      </Paragraph>
      <ul>
        <li>Free shipping</li>
        <li>A 15% off voucher for your next purchase</li>
        <li>Access to Members Only products and sales</li>
        <li>Access to adidas Running and Training apps</li>
        <li>Special offers and promotions</li>
      </ul>
      <Paragraph className="club-paragraph">
        Join now to start earning points, reach new levels and unlock more
        rewards and benefits from adiClub.
      </Paragraph>
      <Button type="default" block className="join-club-btn">
        <span className="join-text">JOIN THE CLUB</span>
        <span className="arrow">&rarr;</span>
      </Button>
    </div>
  );
};

export default JoinClub;
