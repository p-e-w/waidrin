// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import React from "react";
import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { GiBroadheadArrow } from "react-icons/gi";

export default function WizardStep({
  title,
  onNext,
  onBack,
  children,
}: {
  title: string;
  onNext?: () => void;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Flex width="100%" justify="center">
      <Box className="relative" width="60rem" mt="9" mb="9">
        <Heading className="lowercase" size="9" weight="regular" align="center" mb="6">
          {title}
        </Heading>

        <Button className="absolute top-1.5 left-0" variant="classic" size="3" onClick={onBack} disabled={!onBack}>
          <GiBroadheadArrow className="rotate-135" size="25" /> <Text size="6">Back</Text>
        </Button>
        <Button className="absolute top-1.5 right-0" variant="classic" size="3" onClick={onNext} disabled={!onNext}>
          <Text size="6">Next</Text> <GiBroadheadArrow className="-rotate-45" size="25" />
        </Button>

        {children}
      </Box>
    </Flex>
  );
}
