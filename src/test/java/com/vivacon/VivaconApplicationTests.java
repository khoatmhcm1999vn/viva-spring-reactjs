package com.vivacon;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class VivaconApplicationTests {

    @Test
    void contextLoads() {
        Boolean sillyValue = true;
        Assertions.assertEquals(true, sillyValue);
    }
}
